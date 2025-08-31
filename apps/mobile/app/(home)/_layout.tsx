import Location, { LocationObject } from 'expo-location';
import { Stack } from 'expo-router/stack'
import { useEffect, useState } from 'react';

export default function Layout() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  useEffect(() => {
    async function getCurrentLocation() {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);


  return <Stack screenOptions={{
    headerShown: false
  }} />
}