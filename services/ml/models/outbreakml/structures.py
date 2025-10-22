from dataclasses import dataclass

class Report():
  def __init__(self, report, summary, embedding, cluster_id: str | None):
    self.report = report
    self.summary = summary
    self.embedding = embedding
    self.cluster_id = cluster_id

  def __repr__(self):
    return (
      f"Report(report_id={self.report['id']},\n\t"
      f"timestamp={self.report['timestamp']},\n\t"
      f"location=[{self.report['lat']}, {self.report['lon']}],\n\t"
      f"summary='{self.summary}',\n\t"
      f"embedding=Vector({len(self.embedding)}))\n\t"
    )

class Cluster():
  def __init__(self, cluster_id, centroid = [], avg_embedding = [], report_ids = [], common_symptoms = []):
    self.cluster_id = cluster_id
    self.avg_embedding = avg_embedding
    self.report_ids = report_ids
    self.centroid = centroid
    self.common_symptoms = common_symptoms

  def __repr__(self):
    return (
      f"{self.__class__.__name__}(cluster_id={self.cluster_id},\n\t"
      f"avg_embedding=Vector({len(self.avg_embedding)}),\n\t"
      f"reports={self.reports},\n\t"
      f"centroid={self.centroid or "NOT_CALCULATED"},\n\t"
      f"time_range={self.time_range or "NOT_CALCULATED"})"
    )

class ClusterSnapshot(Cluster):
  def __init__(self, cluster_id, time_window_start, time_window_end, centroid = [], avg_embedding = [], reports = [], report_ids = None, common_symptoms = []):
    super().__init__(cluster_id, centroid, avg_embedding, [], common_symptoms)
    self.reports = reports
    self.report_ids = report_ids or [ r['id'] for r in reports ]
    self.centroid = self.centroid["coordinates"] if isinstance(self.centroid, dict) and "coordinates" in self.centroid else self.centroid
    self.time_window_start = time_window_start
    self.time_window_end = time_window_end

  @property
  def report_count(self):
    return len(self.report_ids)

  def __repr__(self):
    return (
      f"{self.__class__.__name__}(cluster_id={self.cluster_id},\n\t"
      f"avg_embedding=Vector({len(self.avg_embedding)}),\n\t"
      f"reports={[ dict(id=r['id'], lat=r['lat'], lon=r['lon'], symptoms=r['symptoms']) for r in self.reports ]},\n\t" # Access as dictionary keys
      f"centroid={self.centroid or "NOT_CALCULATED"},\n\t"
      f"time_window_start={self.time_window_start}),\n\t"
      f"time_window_end={self.time_window_end})\n"
    )

@dataclass
class PredictedSnapshot():
  cluster_id: str
  centroid: list[float]
  common_symptoms: dict
  avg_embedding: list[float]
  report_count: int
  intensity: float
  time_window_start: str
  time_window_end: str

  def __repr__(self):
    return (
      f"{self.__class__.__name__}(cluster_id={self.cluster_id},\n\t"
      f"avg_embedding=Vector({len(self.avg_embedding)}),\n\t"
      f"report_count={self.report_count},\n\t"
      f"centroid={self.centroid or "NOT_CALCULATED"},\n\t"
      f"intensity={self.intensity},\n\t"
      f"common_symptoms={self.common_symptoms},\n\t"
      f"time_window_start={self.time_window_start}),\n\t"
      f"time_window_end={self.time_window_end})\n"
    )
    
class TimedeltaSnapshot():
  def __init__(self, timedelta, time_window_start, time_window_end, snapshots = []):
    self.timedelta = timedelta
    self.time_window_start = time_window_start
    self.time_window_end = time_window_end
    self.snapshots = snapshots

  def __repr__(self):
    return (
      f"{self.__class__.__name__}(time_window_start={self.time_window_start},\n\t"
      f"time_window_end={self.time_window_end},\n\t"
      f"snapshots=[\n\t"
      f"\t{',\n\t'.join([ repr(s).replace('\n', '\n\t') for s in self.snapshots ])}\n\t"
      f"])"
    )