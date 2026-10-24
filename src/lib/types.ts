export type BoladoType = "tabaco" | "beck" | "mesclado" | "cumbaia";
export type RodaRole = "owner" | "admin" | "member";
export type MediaKind = "photo" | "video" | "link";
export type Airflow = "leve" | "ideal" | "pesado";
export type ShopKind = "theme" | "frame" | "title";
export type CriterionKey = "bolar" | "estetica" | "construcao" | "crema" | "sabor" | "experiencia";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  avatar_url?: string | null;
  bio: string | null;
  birthdate?: string | null;
  is_public: boolean;
  xp: number;
  level: number;
  brasas: number;
  active_theme: string;
  active_frame: string | null;
  active_title: string | null;
  streak: number;
  created_at: string;
};

/** Versão enxuta de perfil usada em listas e cartões */
export type ProfileLite = Pick<
  Profile,
  "id" | "username" | "display_name" | "avatar_path" | "level" | "active_frame" | "active_title"
> & { avatar_url?: string | null };

export type Roda = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: string;
  weights: Partial<Record<CriterionKey, number>> | null;
  created_at: string;
  members_count?: number;
  my_role?: RodaRole;
};

export type RodaMember = { role: RodaRole; joined_at: string; profile: ProfileLite };

export type Criterion = {
  key: CriterionKey;
  phase: "pre" | "pos";
  label: string;
  description: string;
  weight: number;
  optional: boolean;
  sort: number;
  checklist: string[];
};

export type Media = {
  id: string;
  bolado_id: string;
  uploader_id: string;
  kind: MediaKind;
  storage_path: string | null;
  url: string | null;
  signed_url?: string | null;
  caption: string | null;
  created_at: string;
};

export type Bolado = {
  id: string;
  roda_id: string;
  roda_name?: string;
  roller_id: string;
  created_by: string | null;
  type: BoladoType;
  rolled_at: string;
  paper: string | null;
  paper_size?: string | null;
  filter: string | null;
  notes: string | null;
  contents?: string[];
  mix_tobacco_pct?: number | null;
  weight_g?: number | null;
  final_score: number | null;
  evaluations_count: number;
  created_at: string;
  roller: ProfileLite;
  cover_url?: string | null;
  media_count?: number;
};

export type EvaluationScore = { criterion_key: CriterionKey; score: number; checklist: string[] };

export type Evaluation = {
  id: string;
  bolado_id: string;
  evaluator_id: string;
  total: number;
  feedback: string | null;
  airflow: Airflow | null;
  created_at: string;
  updated_at: string;
  evaluator: ProfileLite;
  scores: EvaluationScore[];
};

export type BoladoDetail = Bolado & { media: Media[]; evaluations: Evaluation[] };

export type RankingRow = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  avatar_url?: string | null;
  level: number;
  active_frame: string | null;
  active_title: string | null;
  bolados: number;
  avg_score: number | null;
  best_score: number | null;
  nota_ouro: number | null;
  last_rolled_at?: string | null;
};

export type ProfileStats = {
  bolados: number;
  avaliados: number;
  avg_tabaco: number | null;
  avg_beck: number | null;
  by_type?: Partial<Record<BoladoType, number>>;
  top_contents?: string[];
  best: number | null;
  evaluations_given: number;
  avg_given: number | null;
  criteria: Partial<Record<CriterionKey, number>>;
};

export type Badge = {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: "comum" | "rara" | "epica" | "lendaria";
  reward_brasas: number;
  sort: number;
};

export type UserBadge = { badge_key: string; awarded_at: string };

export type ShopItem = {
  key: string;
  kind: ShopKind;
  name: string;
  description: string;
  price: number;
  min_level: number;
  data: { value?: string; swatch?: string[] };
  sort: number;
};

export type XpEvent = { id: number; kind: string; xp: number; brasas: number; created_at: string };

export type Viewer = { id: string; email: string; profile: Profile };

export type Skill = { bolados: number; nota: number | null };

export type Friend = ProfileLite & {
  friendship_id: string;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing";
  since: string;
  bolados: number;
  nota: number | null;
};

export type UserSearchResult = Pick<ProfileLite, "id" | "username" | "display_name" | "avatar_path" | "level" | "active_frame"> & {
  avatar_url?: string | null;
  relation: "none" | "friend" | "outgoing" | "incoming";
};

export type SkillPeer = ProfileLite & { is_friend: boolean; bolados: number; nota: number | null };

export type PlaybookStep = { id: string; position: number; title: string; body: string | null; media_path: string | null; media_url?: string | null };

export type Playbook = {
  user_id: string;
  style: string | null;
  intro: string | null;
  tips: string | null;
  favorite_paper: string | null;
  favorite_filter: string | null;
  favorite_size: string | null;
  time_minutes: number | null;
  updated_at: string;
  steps: PlaybookStep[];
};
