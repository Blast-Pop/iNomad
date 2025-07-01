import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export default function useLocationTracking() {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(null);

  useEffect(() => {
    let locationSubscription = null;
    let headingSubscription = null;

    (async () => {
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
        (loc) => setLocation(loc.coords)
      );

      headingSubscription = await Location.watchHeadingAsync((headingData) => {
        setHeading(headingData.trueHeading);
      });
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (headingSubscription) headingSubscription.remove();
    };
  }, []);

  return { location, heading };
}
