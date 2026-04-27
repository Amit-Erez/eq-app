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
import { tracks } from "../constants";
import type { Track } from "../types/Types";

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [chosenTrack, setChosenTrack] = useState<Track>(tracks[0]);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("ended", onEnded);
    };
  }, [chosenTrack]);

  const playAudio = async (): Promise<void> => {
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
    console.log("test");
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
      <div className="flex items-center width-2/3">
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
