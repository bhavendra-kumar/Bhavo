"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingDown,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import {
  BikeIcon,
  AutoIcon,
  HatchbackIcon,
  SedanIcon,
  SuvIcon,
  ParcelDeliveryIcon,
} from "@/components/user/book-ride/VehicleIcons";

interface FleetVehicle {
  id: string;
  name: string;
  description: string;
  iconComponent: React.ComponentType<{ className?: string }>;
  href: string;
}

const FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: "bike",
    name: "Bike-Taxi",
    description: "Beat traffic, ride quicker",
    iconComponent: BikeIcon,
    href: "/user/book-ride?vehicle=bike",
  },
  {
    id: "auto",
    name: "Auto",
    description: "Everyday autos, made easy",
    iconComponent: AutoIcon,
    href: "/user/book-ride?vehicle=auto",
  },
  {
    id: "economy",
    name: "Cab Economy",
    description: "Comfort for every journey",
    iconComponent: HatchbackIcon,
    href: "/user/book-ride?vehicle=economy",
  },
  {
    id: "premium",
    name: "Cab Premium",
    description: "Executive comfort & extra room",
    iconComponent: SedanIcon,
    href: "/user/book-ride?vehicle=premium",
  },
  {
    id: "xl",
    name: "Cab XL",
    description: "Spacious rides for groups",
    iconComponent: SuvIcon,
    href: "/user/book-ride?vehicle=xl",
  },
  {
    id: "parcel",
    name: "Parcel",
    description: "Quick, secure & reliable delivery",
    iconComponent: ParcelDeliveryIcon,
    href: "/user/book-ride?vehicle=parcel",
  },
];

export default function FleetSection() {
  return (
    <section id="fleet" className="fleet-section">
      <div id="services" style={{ position: "absolute", top: -90, pointerEvents: "none" }} />
      <div className="fleet-container">
        {/* Section Header styled consistently with remaining sections (Image 3) */}
        <div className="fleet-header">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              color: "#075B55",
              background: "rgba(7, 91, 85, 0.08)",
              border: "1px solid rgba(7, 91, 85, 0.18)",
              padding: "5px 14px",
              borderRadius: 99,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} style={{ color: "#10B8A6" }} />
            <span>Our Comprehensive Fleet</span>
          </div>

          <h2 className="fleet-title">
            Distinct Vehicles for Every Travel Need
          </h2>

          <p className="fleet-subtitle">
            From quick solo bike rides to spacious family cabs and courier delivery, choose the right ride at accessible everyday rates.
          </p>
        </div>

        {/* Streamlined Affordability Strip (Minimal Content) */}
        <div className="affordability-strip">
          <div className="strip-left">
            <div className="strip-badge">
              <TrendingDown size={13} className="strip-badge-icon" />
              <span>COMMITTED TO AFFORDABILITY</span>
            </div>
            <h3 className="strip-heading">Transportation Built to Support You</h3>
            <p className="strip-body">
              Safe, dependable mobility with transparent distance-based pricing and zero hidden fees.
            </p>
          </div>

          <div className="strip-pills">
            <div className="strip-pill">
              <CheckCircle2 size={15} className="pill-icon" />
              <div className="pill-text-wrap">
                <span className="pill-title">100% Upfront</span>
                <span className="pill-sub">No fare surprises</span>
              </div>
            </div>

            <div className="strip-pill">
              <Clock size={15} className="pill-icon" />
              <div className="pill-text-wrap">
                <span className="pill-title">Meter-Accurate</span>
                <span className="pill-sub">True road distance</span>
              </div>
            </div>

            <div className="strip-pill">
              <HeartHandshake size={15} className="pill-icon" />
              <div className="pill-text-wrap">
                <span className="pill-title">People First</span>
                <span className="pill-sub">Low platform fees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean, Horizontal Vehicle Cards matching Rapido layout */}
        <div className="fleet-cards-grid">
          {FLEET_VEHICLES.map((vehicle) => {
            const IconComp = vehicle.iconComponent;
            return (
              <Link
                key={vehicle.id}
                href={vehicle.href}
                className="horizontal-fleet-card"
              >
                <div className="card-info-col">
                  <h3 className="card-vehicle-title">{vehicle.name}</h3>
                  <p className="card-vehicle-desc">{vehicle.description}</p>
                </div>

                <div className="card-artwork-col">
                  <IconComp className="card-vehicle-illustration" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style>{`
        .fleet-section {
          background: #ffffff;
          padding: 64px 24px 72px;
          position: relative;
          scroll-margin-top: 80px;
        }

        .fleet-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Section Header */
        .fleet-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 36px;
        }

        /* Pill Badge matching other sections (Image 3) */
        .section-pill {
          font-size: 12px;
          font-weight: 800;
          color: #075B55;
          background: "rgba(7, 91, 85, 0.08)";
          background: rgba(7, 91, 85, 0.08);
          border: 1px solid rgba(7, 91, 85, 0.18);
          padding: 4px 12px;
          border-radius: 99px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          display: inline-block;
        }

        .fleet-title {
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 900;
          color: #142B29;
          letter-spacing: -1px;
          margin: 0 0 14px;
          line-height: 1.15;
        }

        .fleet-subtitle {
          font-size: 16px;
          color: #475569;
          line-height: 1.6;
          margin: 0 auto;
          max-width: 640px;
        }

        /* Streamlined Affordability Strip */
        .affordability-strip {
          background: linear-gradient(135deg, #075b55 0%, #064e48 60%, #043834 100%);
          border-radius: 16px;
          padding: 18px 24px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
          box-shadow: 0 8px 24px rgba(7, 91, 85, 0.12);
        }

        .strip-left {
          flex: 1;
          min-width: 0;
        }

        .strip-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 3px 8px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #99f6e4;
          margin-bottom: 6px;
        }

        .strip-badge-icon {
          color: #2dd4bf;
        }

        .strip-heading {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.3px;
          margin: 0 0 4px;
          line-height: 1.25;
        }

        .strip-body {
          font-size: 13px;
          color: #ccfbf1;
          line-height: 1.45;
          margin: 0;
        }

        .strip-pills {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .strip-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 10px 14px;
          backdrop-filter: blur(4px);
        }

        .pill-icon {
          color: #2dd4bf;
          flex-shrink: 0;
        }

        .pill-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .pill-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
        }

        .pill-sub {
          font-size: 11px;
          color: #99f6e4;
          line-height: 1.2;
        }

        /* Clean, Horizontal Vehicle Cards matching Rapido layout */
        .fleet-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .horizontal-fleet-card {
          background: #f8fafc;
          border: 1.5px solid #edf2f7;
          border-radius: 18px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          min-height: 112px;
          transition: all 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
          position: relative;
          overflow: hidden;
        }

        .horizontal-fleet-card:hover {
          background: #ffffff;
          border-color: #075b55;
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(7, 91, 85, 0.09);
        }

        .card-info-col {
          flex: 1;
          padding-right: 14px;
        }

        .card-vehicle-title {
          font-size: 21px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.4px;
          margin: 0 0 4px;
          line-height: 1.2;
        }

        .card-vehicle-desc {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          line-height: 1.45;
          margin: 0;
        }

        .card-artwork-col {
          flex-shrink: 0;
          width: 96px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-vehicle-illustration {
          width: 92px;
          height: 58px;
          transition: transform 0.25s ease;
        }

        .horizontal-fleet-card:hover .card-vehicle-illustration {
          transform: scale(1.08) translateX(2px);
        }

        /* Responsive Media Queries */
        @media (max-width: 1024px) {
          .fleet-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .affordability-strip {
            flex-direction: column;
            align-items: flex-start;
            padding: 18px 20px;
            gap: 16px;
          }

          .strip-pills {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }

        @media (max-width: 640px) {
          .fleet-section {
            padding: 48px 16px 56px;
          }

          .fleet-cards-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .horizontal-fleet-card {
            padding: 18px 20px;
            min-height: 98px;
          }

          .card-vehicle-title {
            font-size: 19px;
          }

          .card-vehicle-desc {
            font-size: 13.5px;
          }

          .card-artwork-col {
            width: 82px;
            height: 54px;
          }

          .card-vehicle-illustration {
            width: 80px;
            height: 50px;
          }

          .strip-pills {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
