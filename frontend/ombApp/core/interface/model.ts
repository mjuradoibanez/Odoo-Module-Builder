export interface Model {
  id: number;
  name: string;
  technicalName: string;
  module: {
    id: number;
    name: string;
    technicalName: string;
  };
}
