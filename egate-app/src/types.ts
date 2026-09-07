export type VisitorStatus = "pending" | "approved" | "exited";

export type Visitor = {
  id: string;
  name: string;
  host: string;
  purpose: string;
  phone?: string;
  createdAt: string;
  status: VisitorStatus;
};
