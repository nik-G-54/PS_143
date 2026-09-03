import { BacktrackResponse, VesselsResponse } from '../types/api';
import { generateDemoTrajectory, generateDemoEnvironment, generateDemoAISTrack } from '../utils/demoGenerator';

export interface DataSources {
  observation: 'Backend' | 'Simulated Demo';
  releaseTime: 'Backend' | 'Simulated Demo';
  sourceEstimate: 'Backend' | 'Simulated Demo';
  trajectory: 'Backend' | 'Simulated Demo';
  environment: 'Backend' | 'Simulated Demo';
  vessels: 'Backend' | 'Simulated Demo';
  vesselTracks: 'Backend' | 'Simulated Demo';
}

export interface NormalizedReconstruction {
  spillDetails: any;
  backtrackData: BacktrackResponse;
  vesselsData: VesselsResponse;
  environment: { wind: { speed: number, direction: number }, current: { speed: number, direction: number } };
  dataSources: DataSources;
}

export const resolveReconstruction = (
  spillDetails: any,
  backtrack: BacktrackResponse,
  vessels: VesselsResponse,
  visRes?: any
): NormalizedReconstruction => {
  const dataSources: DataSources = {
    observation: 'Backend',
    releaseTime: 'Backend',
    sourceEstimate: 'Backend',
    trajectory: 'Backend',
    environment: 'Backend',
    vessels: 'Backend',
    vesselTracks: 'Backend'
  };

  const newBacktrack = JSON.parse(JSON.stringify(backtrack)) as BacktrackResponse;
  const newVessels = JSON.parse(JSON.stringify(vessels)) as VesselsResponse;
  let env = { wind: { speed: 0, direction: 0 }, current: { speed: 0, direction: 0 } };

  const obs = newBacktrack.backtrack.observation;
  const src = newBacktrack.backtrack.source_estimate;
  const relTime = newBacktrack.backtrack.estimated_release_time;

  // Environment data
  if (visRes && visRes.environment) {
    env = {
      wind: {
        speed: visRes.environment.wind.speed,
        direction: visRes.environment.wind.direction
      },
      current: {
        speed: visRes.environment.current.speed,
        direction: visRes.environment.current.direction
      }
    };
  } else {
    dataSources.environment = 'Simulated Demo';
    env = generateDemoEnvironment(obs.latitude, obs.longitude);
  }

  // Source estimate update from visRes if available
  if (visRes && visRes.source_estimate) {
    newBacktrack.backtrack.source_estimate = visRes.source_estimate;
  }

  // Trajectory update
  if (visRes && visRes.trajectory && visRes.trajectory.length > 0) {
    // Normalize trajectory: OLDEST -> NEWEST
    const sortedTrajectory = [...visRes.trajectory].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (isNaN(timeA) || isNaN(timeB)) return 0;
      return timeA - timeB;
    });
    newBacktrack.backtrack.trajectory = sortedTrajectory;
  } else if (!newBacktrack.backtrack.trajectory || newBacktrack.backtrack.trajectory.length === 0) {
    dataSources.trajectory = 'Simulated Demo';
    if (src && relTime) {
      newBacktrack.backtrack.trajectory = generateDemoTrajectory(src, obs, relTime, obs.timestamp);
    } else {
      newBacktrack.backtrack.trajectory = [];
    }
  }

  // Ensure the internal array is always present
  if (!newVessels.vessels) {
    newVessels.vessels = (newVessels as any).candidates || [];
  }
  delete (newVessels as any).candidates;

  // AIS Track fallback
  let hasBackendTracks = true;
  newVessels.vessels.forEach(candidate => {
    if (!candidate.track || candidate.track.length === 0) {
      hasBackendTracks = false;
      if (src && relTime) {
        candidate.track = generateDemoAISTrack(
          src, 
          obs, 
          relTime, 
          obs.timestamp, 
          candidate.vessel_id,
          candidate.rank || 1,
          candidate.distance_to_origin_km || (candidate.rank || 1) * 5
        );
      } else {
        candidate.track = [];
      }
    }
  });

  if (!hasBackendTracks) {
    dataSources.vesselTracks = 'Simulated Demo';
  }

  return {
    spillDetails,
    backtrackData: newBacktrack,
    vesselsData: newVessels,
    environment: env,
    dataSources
  };
};