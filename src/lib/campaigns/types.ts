export type Campaign = {
  id: string;
  event_id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  status:
    | "draft"
    | "published"
    | "paused"
    | "archived";
  views: number;
  generations: number;
  downloads: number;
  shares: number;
  participants: number;
};

export type PhotoConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  shape?: "rectangle" | "circle";
};

export type NameConfig = {
  x: number;
  y: number;
  width: number;
  fontSize: number;
  textAlign?: "left" | "center" | "right";
  fontFamily?: string;
  fontWeight?: string | number;
  color?: string;
  angle?: number;
};

export type CanvasConfig = {
  canvas?: {
    width: number;
    height: number;
  };
  photo: PhotoConfig | null;
  name: NameConfig | null;
};

export type Template = {
  id: string;
  campaign_id: string;
  name: string;
  asset_url: string;
  width: number;
  height: number;
  canvas_config: CanvasConfig | null;
  version: number;
  is_active: boolean;
};

export type PhotoPosition = {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  shape: "rectangle" | "circle";
};

export type NamePosition = {
  left: number;
  top: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  textAlign: "left" | "center" | "right";
  color: string;
  angle: number;
};