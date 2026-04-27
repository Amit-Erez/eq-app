import {
  faBackward,
  faBackwardStep,
  faForward,
  faForwardStep,
  faPause,
  faPlay,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { baselineY, tracks } from "../constants";
import type { freqBand, Track } from "../types/Types";
import { buildSpectrumPath } from "../lib/utils/audioMath";

export function AudioPlayer({
  bandsArr,
  setWaveformPath,
}: {
  bandsArr: freqBand[];
  setWaveformPath: (path: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [chosenTrack, setChosenTrack] = useState<Track>(tracks[0]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const previousDataRef = useRef<Uint8Array | null>(null);


  useEffect(() => {
    const analyser = analyserRef.current;
    const audioContext = audioContextRef.current;
    if (!analyser || !audioContext || !isPlaying) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    function updateSpectrum() {
      analyser?.getByteFrequencyData(dataArray);

      const previousData =
        previousDataRef.current || new Uint8Array(dataArray.length);

      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = Math.max(dataArray[i], previousData[i] * 0.9);
      }

      previousDataRef.current = new Uint8Array(dataArray);

      const path = buildSpectrumPath(
        dataArray,
        800,
        480,
        baselineY,
        120,
        audioContext?.sampleRate ?? 44100,
        bandsArr,
      );

      setWaveformPath(path);

      animationId = requestAnimationFrame(updateSpectrum);
    }

    updateSpectrum();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, bandsArr]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("ended", onEnded);
    };
  }, [chosenTrack]);

  useEffect(() => {
    filtersRef.current.forEach((filter, index) => {
      const band = bandsArr[index];
      if (!band) return;

      filter.frequency.value = band.freqValue;
      filter.gain.value = band.gainValue;
      filter.Q.value = band.qValue;
    });
  }, [bandsArr]);

    function nextTrack() {
    const currentIndex = tracks.findIndex(
      (track) => track.fileName === chosenTrack.fileName,
    );
    const nextIndex = (currentIndex + 1) % tracks.length;
    setChosenTrack(tracks[nextIndex]);
    if (!isPlaying) return;
    setTimeout(() => {
      playAudio();
    }, 100);
  }

  function prevTrack() {
    const currentIndex = tracks.findIndex(
      (track) => track.fileName === chosenTrack.fileName,
    );
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setChosenTrack(tracks[prevIndex]);
    if (!isPlaying) return;
    setTimeout(() => {
      playAudio();
    }, 100);
  }

  function setupAudioContext() {
    const audio = audioRef.current;
    if (!audio) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);

    const filters: BiquadFilterNode[] = bandsArr.map((band: freqBand) => {
      const filter = audioContext.createBiquadFilter();
      if (band.type === "low-shelf") filter.type = "lowshelf";
      else if (band.type === "high-shelf") filter.type = "highshelf";
      else filter.type = "peaking";

      filter.frequency.value = band.freqValue;
      filter.gain.value = band.gainValue;
      filter.Q.value = band.qValue;

      return filter;
    });

    source.connect(filters[0]);

    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }

    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 4096;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.92;

    filters[filters.length - 1].connect(analyser);
    analyser.connect(audioContext.destination);

    analyserRef.current = analyser;

    filtersRef.current = filters;

    audioContextRef.current = audioContext;
    sourceRef.current = source;
  }

  const playAudio = async (): Promise<void> => {
    if (!audioContextRef.current) {
      setupAudioContext();
    }
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        return;
      }
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  };

  const pauseAudio = (): void => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    audio.pause();
    setIsPlaying(false);
  };

  const stopAudio = (): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  };

  function playChosenTrack(track: Track): void {
    setChosenTrack(track);
    setTimeout(() => {
      playAudio();
    }, 100);
  }

  const skipTenSecondsHandler = (direction: "forward" | "backward"): void => {
    const audio = audioRef.current;
    if (!audio) return;
    if (direction === "forward") {
      audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
    } else {
      audio.currentTime = Math.max(audio.currentTime - 10, 0);
    }
  };

  return (
    <>
      <div className="flex items-center">
        <select
          className="text-white/25 ml-4 pr-2 border-none text-sm"
          value={chosenTrack.fileName}
          onChange={(e) => {
            const track = tracks.find((t) => t.fileName === e.target.value);
            if (track) playChosenTrack(track);
          }}
        >
          {tracks.map((track) => (
            <option
              key={track.fileName}
              value={track.fileName}
              className="text-white/25 border-none bg-[#141417]"
            >
              {track.name}
            </option>
          ))}
        </select>
        <FontAwesomeIcon
          icon={faBackwardStep}
          className="text-white/25 cursor-pointer hover:scale-110 ml-1"
          onClick={prevTrack}
        />
        <FontAwesomeIcon
          icon={faBackward}
          className="text-white/25 cursor-pointer hover:scale-110"
          onClick={() => skipTenSecondsHandler("backward")}
        />
        <FontAwesomeIcon
          icon={faStop}
          className="text-white/25 cursor-pointer hover:scale-110 ml-1"
          onClick={stopAudio}
        />
        <FontAwesomeIcon
          icon={faPlay}
          className="text-white/25 cursor-pointer hover:scale-110 ml-1"
          onClick={playAudio}
        />
        <FontAwesomeIcon
          icon={faPause}
          className="text-white/25 cursor-pointer hover:scale-110 ml-1"
          onClick={pauseAudio}
        />
        <FontAwesomeIcon
          icon={faForward}
          className="text-white/25 cursor-pointer hover:scale-110 ml-1"
          onClick={() => skipTenSecondsHandler("forward")}
        />
        <FontAwesomeIcon
          icon={faForwardStep}
          className="text-white/25 cursor-pointer hover:scale-110 ml-1"
          onClick={nextTrack}
        />
      </div>
      <audio
        ref={audioRef}
        src={`/${chosenTrack.fileName}.mp3`}
        preload="auto"
      />
    </>
  );
}
