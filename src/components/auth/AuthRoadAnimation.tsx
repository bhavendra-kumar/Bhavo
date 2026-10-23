"use client";

import React from "react";
import { AutoIcon, HatchbackIcon } from "@/components/user/book-ride/VehicleIcons";

export default function AuthRoadAnimation() {
  return (
    <div className="auth-bottom-road" aria-hidden="true">
      <style>{`
        .auth-bottom-road {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 84px;
          background: linear-gradient(180deg, rgba(2, 11, 11, 0.4) 0%, #030808 30%, #010404 100%);
          border-top: 1px solid rgba(20, 184, 166, 0.22);
          pointer-events: none;
          overflow: hidden;
          z-index: 2;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(45, 212, 191, 0.15);
        }

        /* Subtle asphalt texture */
        .auth-road-asphalt {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 100%, rgba(13, 148, 136, 0.08) 0%, transparent 70%);
        }

        /* Animated Lane Center Dashes */
        .auth-road-stripes {
          position: absolute;
          bottom: 24px;
          left: 0;
          right: 0;
          height: 3px;
          background: repeating-linear-gradient(
            90deg,
            rgba(20, 184, 166, 0.42) 0,
            rgba(20, 184, 166, 0.42) 28px,
            transparent 28px,
            transparent 60px
          );
          animation: roadDashes 1.6s linear infinite;
        }

        @keyframes roadDashes {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: -60px 0;
          }
        }

        /* Top asphalt kerb guide line */
        .auth-road-kerb {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, rgba(20, 184, 166, 0.1) 0%, rgba(20, 184, 166, 0.35) 50%, rgba(20, 184, 166, 0.1) 100%);
        }

        /* Vehicle Track: Moves from left to right */
        .vehicle-runner {
          position: absolute;
          display: flex;
          align-items: flex-end;
          will-change: transform;
        }

        /* Specialized Cab (Hatchback/Sedan) */
        .cab-runner {
          bottom: 11px;
          width: 108px;
          height: 64px;
          animation: cabDrive 15s linear infinite;
        }

        /* Specialized Auto Rickshaw */
        .auto-runner {
          bottom: 12px;
          width: 96px;
          height: 58px;
          animation: autoDrive 20s linear 7s infinite;
        }

        @keyframes cabDrive {
          0% {
            transform: translateX(-160px);
          }
          100% {
            transform: translateX(calc(100vw + 160px));
          }
        }

        @keyframes autoDrive {
          0% {
            transform: translateX(-160px);
          }
          100% {
            transform: translateX(calc(100vw + 160px));
          }
        }

        /* Suspension engine micro-bounce */
        .vehicle-body-bounce {
          animation: vehBounce 0.38s ease-in-out infinite alternate;
        }

        .auto-body-bounce {
          animation: vehBounce 0.32s ease-in-out infinite alternate;
        }

        @keyframes vehBounce {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-1.5px);
          }
        }

        /* Headlight beam projected on the road */
        .cab-headlight-projection {
          position: absolute;
          left: 82px;
          bottom: 12px;
          width: 115px;
          height: 38px;
          pointer-events: none;
          background: radial-gradient(ellipse 90% 60% at 0% 50%, rgba(94, 234, 212, 0.4) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 100%);
          transform: perspective(60px) rotateY(-8deg);
          filter: blur(1px);
          animation: lightFlicker 2s ease-in-out infinite alternate;
        }

        .auto-headlight-projection {
          position: absolute;
          left: 72px;
          bottom: 12px;
          width: 105px;
          height: 36px;
          pointer-events: none;
          background: radial-gradient(ellipse 90% 60% at 0% 50%, rgba(254, 240, 138, 0.45) 0%, rgba(250, 204, 21, 0.18) 50%, transparent 100%);
          transform: perspective(60px) rotateY(-8deg);
          filter: blur(1px);
          animation: lightFlicker 1.8s ease-in-out infinite alternate;
        }

        @keyframes lightFlicker {
          0% {
            opacity: 0.65;
          }
          100% {
            opacity: 0.95;
          }
        }

        /* Spinning Wheel animation for the animatic SVGs */
        .veh-wheel-front, .veh-wheel-rear {
          transform-box: fill-box;
          transform-origin: center;
          animation: wheelSpin 0.42s linear infinite;
        }

        @keyframes wheelSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Road Asphalt Base */}
      <div className="auth-road-asphalt" />
      <div className="auth-road-kerb" />

      {/* Road Lane Center Dashes */}
      <div className="auth-road-stripes" />

      {/* 1. Specialized Cab (Hatchback/Sedan) Moving Left to Right */}
      <div className="vehicle-runner cab-runner">
        {/* Forward Headlight Beam Projection onto Road */}
        <div className="cab-headlight-projection" />
        <div className="vehicle-body-bounce" style={{ width: "100%", height: "100%" }}>
          <HatchbackIcon className="w-full h-full" style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
      </div>

      {/* 2. Specialized Auto Rickshaw Moving Left to Right */}
      <div className="vehicle-runner auto-runner">
        {/* Forward Headlight Beam Projection onto Road */}
        <div className="auto-headlight-projection" />
        <div className="auto-body-bounce" style={{ width: "100%", height: "100%" }}>
          <AutoIcon className="w-full h-full" style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
      </div>
    </div>
  );
}
