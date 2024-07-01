import { relations } from "drizzle-orm/relations";
import { usersInAuth, profile } from "./schema";

export const profileRelations = relations(profile, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [profile.id],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	profiles: many(profile),
}));