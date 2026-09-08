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
  visRes?: any,
  attrTrajRes?: any
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

  // AIS Track fallback and Attribution Trajectory merging
  if (attrTrajRes && attrTrajRes.vessels) {
    dataSources.vesselTracks = 'Backend';
    dataSources.vessels = 'Backend';
    newVessels.vessels = attrTrajRes.vessels.map((v: any) => {
      const track = v.trajectory ? v.trajectory.map((p: any) => ({
        timestamp: p.timestamp,
        latitude: p.latitude,
        longitude: p.longitude,
        speed: p.speed,
        course: p.course,
        heading: p.heading,
      })) : [];
      
      // Sort track by timestamp just in case
      track.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Diagnostic check for unusually large segment distances
      for (let i = 0; i < track.length - 1; i++) {
        const p1 = track[i];
        const p2 = track[i + 1];
        // simple cartesian dist for diagnostic
        const dx = p2.longitude - p1.longitude;
        const dy = p2.latitude - p1.latitude;
        const distDeg = Math.sqrt(dx*dx + dy*dy);
        if (distDeg > 2) { // 2 degrees is huge, ~222km jump
          console.warn(`Trajectory contains unusually large segment distance. Vessel: ${v.vessel_id}, P1: ${p1.timestamp}, P2: ${p2.timestamp}`);
        }
      }

      return {
        vessel_id: v.vessel_id,
        is_mock: v.is_mock,
        rank: v.rank,
        score: v.score,
        vessel_name: v.vessel_name,
        mmsi: v.mmsi,
        imo: v.imo,
        distance_to_origin_km: v.distance_from_backtrack_origin_km,
        track,
        culprit_location: v.culprit_location,
        culprit_position_timestamp: attrTrajRes.verification?.culprit_position_timestamp
      };
    });
    // Set candidate count if available in attribution response
    if (attrTrajRes.attribution && attrTrajRes.attribution.candidate_count) {
      newVessels.candidate_count = attrTrajRes.attribution.candidate_count;
    }
  } else {
    // Ensure the internal array is always present
    if (!newVessels.vessels) {
      newVessels.vessels = (newVessels as any).candidates || [];
    }
    delete (newVessels as any).candidates;

    // Existing fallback
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
  }

  return {
    spillDetails,
    backtrackData: newBacktrack,
    vesselsData: newVessels,
    environment: env,
    dataSources
  };
};