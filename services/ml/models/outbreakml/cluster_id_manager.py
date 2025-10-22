"""
Cluster ID Management System

This module provides functionality to maintain unique cluster IDs across recalculations,
ensuring that clusters can be tracked over time even when they split or merge.
"""

import uuid
from collections import defaultdict
from typing import Dict, List, Set, Tuple, Optional
from datetime import datetime

from common.db import supabase


class ClusterIDManager:
    """
    Manages cluster IDs to maintain consistency across recalculations.
    
    Key features:
    - Maps new cluster labels to existing cluster IDs based on report overlap
    - Preserves original cluster ID for the first segment when clusters split
    - Assigns new IDs to newly created clusters
    - Tracks cluster evolution over time
    """
    
    def __init__(self):
        self.cluster_id_counter = self._get_next_cluster_id_counter()
    
    def _get_next_cluster_id_counter(self) -> int:
        """Get the next available cluster ID counter from the database."""
        try:
            result = supabase.rpc("get_next_cluster_id_counter").execute()
            return result.data[0] if result.data else 0
        except Exception:
            # If the function doesn't exist yet, start from 0
            return 0
    
    def _generate_cluster_id(self) -> str:
        """Generate a new unique cluster ID."""
        cluster_id = f"cluster_{self.cluster_id_counter}"
        self.cluster_id_counter += 1
        return cluster_id
    
    def map_clusters_to_existing_ids(
        self, 
        new_labels: List[int], 
        reports: List[dict],
        previous_cluster_mapping: Optional[Dict[int, str]] = None
    ) -> Dict[int, str]:
        """
        Map new cluster labels to existing cluster IDs based on report overlap.
        
        Args:
            new_labels: List of cluster labels from current clustering
            reports: List of reports with 'id' field
            previous_cluster_mapping: Previous mapping of labels to cluster IDs
            
        Returns:
            Dictionary mapping new labels to cluster IDs
        """
        if previous_cluster_mapping is None:
            previous_cluster_mapping = self._load_previous_cluster_mapping()
        
        # Group reports by new cluster label
        new_clusters = defaultdict(list)
        for label, report in zip(new_labels, reports):
            if label != -1:  # Ignore noise points
                new_clusters[label].append(report['id'])
        
        # Map new clusters to existing IDs
        label_to_cluster_id = {}
        used_cluster_ids = set()
        
        for new_label, report_ids in new_clusters.items():
            best_match_id = self._find_best_cluster_match(
                report_ids, 
                previous_cluster_mapping,
                used_cluster_ids
            )
            
            if best_match_id:
                label_to_cluster_id[new_label] = best_match_id
                used_cluster_ids.add(best_match_id)
            else:
                # Create new cluster ID for unmatched cluster
                label_to_cluster_id[new_label] = self._generate_cluster_id()
        
        return label_to_cluster_id
    
    def _find_best_cluster_match(
        self, 
        report_ids: List[int], 
        previous_mapping: Dict[int, str],
        used_cluster_ids: Set[str]
    ) -> Optional[str]:
        """
        Find the best matching existing cluster ID based on report overlap.
        
        Args:
            report_ids: List of report IDs in the new cluster
            previous_mapping: Previous mapping of labels to cluster IDs
            used_cluster_ids: Set of already used cluster IDs
            
        Returns:
            Best matching cluster ID or None if no good match found
        """
        if not previous_mapping:
            return None
        
        # Get previous cluster report mappings
        previous_cluster_reports = self._get_previous_cluster_reports()
        
        best_match_id = None
        best_overlap_ratio = 0.0
        
        for cluster_id, prev_report_ids in previous_cluster_reports.items():
            if cluster_id in used_cluster_ids:
                continue
                
            # Calculate overlap ratio
            overlap = len(set(report_ids) & set(prev_report_ids))
            total_unique = len(set(report_ids) | set(prev_report_ids))
            
            if total_unique > 0:
                overlap_ratio = overlap / total_unique
                
                # Use a threshold to determine if clusters are similar enough
                if overlap_ratio > 0.3 and overlap_ratio > best_overlap_ratio:
                    best_overlap_ratio = overlap_ratio
                    best_match_id = cluster_id
        
        return best_match_id
    
    def _get_previous_cluster_reports(self) -> Dict[str, List[int]]:
        """Get the most recent cluster-to-reports mapping from the database."""
        try:
            result = supabase.rpc("get_latest_cluster_reports").execute()
            return {row['cluster_id']: row['report_ids'] for row in result.data}
        except Exception:
            return {}
    
    def _load_previous_cluster_mapping(self) -> Dict[int, str]:
        """Load the previous cluster label to ID mapping."""
        try:
            result = supabase.rpc("get_latest_cluster_mapping").execute()
            return {row['label']: row['cluster_id'] for row in result.data}
        except Exception:
            return {}
    
    def handle_cluster_splits(
        self,
        labels: List[int],
        reports: List[dict],
        cluster_id_mapping: Dict[int, str],
        max_time_gap_days: int = 14
    ) -> Tuple[List[int], Dict[int, str]]:
        """
        Handle cluster splits while preserving cluster IDs.
        
        When a cluster is split due to time gaps, the first segment keeps
        the original cluster ID, and subsequent segments get new IDs.
        
        Args:
            labels: Current cluster labels
            reports: List of reports with 'id' and 'timestamp'
            cluster_id_mapping: Current mapping of labels to cluster IDs
            max_time_gap_days: Maximum allowed gap before splitting
            
        Returns:
            Tuple of (updated_labels, updated_cluster_id_mapping)
        """
        from datetime import datetime, timedelta
        
        # Group reports by cluster label
        cluster_reports = defaultdict(list)
        for label, report in zip(labels, reports):
            if label != -1:
                cluster_reports[label].append(report)
        
        new_labels = labels.copy()
        new_cluster_id_mapping = cluster_id_mapping.copy()
        
        for label, cluster_reports_list in cluster_reports.items():
            if len(cluster_reports_list) <= 1:
                continue
                
            # Sort reports by timestamp
            cluster_reports_list.sort(key=lambda r: datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00')))
            
            # Find split points based on time gaps
            split_indices = []
            for i in range(1, len(cluster_reports_list)):
                prev_time = datetime.fromisoformat(cluster_reports_list[i-1]['timestamp'].replace('Z', '+00:00'))
                curr_time = datetime.fromisoformat(cluster_reports_list[i]['timestamp'].replace('Z', '+00:00'))
                
                if (curr_time - prev_time).days > max_time_gap_days:
                    split_indices.append(i)
            
            if split_indices:
                # Split the cluster
                original_cluster_id = cluster_id_mapping.get(label)
                if not original_cluster_id:
                    original_cluster_id = self._generate_cluster_id()
                    new_cluster_id_mapping[label] = original_cluster_id
                
                # Create new labels for split segments
                current_label = label
                segment_start = 0
                
                for split_idx in split_indices:
                    # Update labels for current segment
                    for i in range(segment_start, split_idx):
                        report_id = cluster_reports_list[i]['id']
                        report_idx = next(idx for idx, r in enumerate(reports) if r['id'] == report_id)
                        new_labels[report_idx] = current_label
                    
                    # Create new label and cluster ID for next segment
                    current_label = max(new_labels) + 1 if new_labels.size > 0 else 0
                    new_cluster_id_mapping[current_label] = self._generate_cluster_id()
                    segment_start = split_idx
                
                # Handle the last segment
                for i in range(segment_start, len(cluster_reports_list)):
                    report_id = cluster_reports_list[i]['id']
                    report_idx = next(idx for idx, r in enumerate(reports) if r['id'] == report_id)
                    new_labels[report_idx] = current_label
        
        return new_labels, new_cluster_id_mapping
    
    def save_cluster_mapping(self, cluster_id_mapping: Dict[int, str], labels: List[int], reports: List[dict]):
        """Save the current cluster mapping to the database."""
        try:
            # Save cluster mapping
            mapping_data = [
                {
                    'label': label,
                    'cluster_id': cluster_id,
                    'created_at': datetime.now().isoformat()
                }
                for label, cluster_id in cluster_id_mapping.items()
            ]
            
            supabase.table('cluster_mappings').insert(mapping_data).execute()
            
            # Save cluster reports mapping
            cluster_reports_data = []
            cluster_reports = defaultdict(list)
            
            for label, report in zip(labels, reports):
                if label != -1 and label in cluster_id_mapping:
                    cluster_reports[cluster_id_mapping[label]].append(report['id'])
            
            for cluster_id, report_ids in cluster_reports.items():
                cluster_reports_data.append({
                    'cluster_id': cluster_id,
                    'report_ids': report_ids,
                    'created_at': datetime.now().isoformat()
                })
            
            supabase.table('cluster_reports').insert(cluster_reports_data).execute()
            
            # Update cluster ID counter
            supabase.rpc('update_cluster_id_counter', {'counter': self.cluster_id_counter}).execute()
            
        except Exception as e:
            print(f"Error saving cluster mapping: {e}")


def create_cluster_id_manager() -> ClusterIDManager:
    """Factory function to create a ClusterIDManager instance."""
    return ClusterIDManager()
