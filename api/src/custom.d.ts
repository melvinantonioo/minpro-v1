export type User = {
    email: string;
    name: string;
    role: string;
    points: number;
    id: number
};

declare global {
    namespace Express {
        export interface Request {
            user?: User;
        }
    }
}