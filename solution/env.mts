import { z } from "zod";

const zodSchema = z.object({
    DATABASE_URL: z.string().startsWith("mongodb://"),
});

type ENV_type = z.infer<typeof zodSchema>;

export let env: ENV_type;

try {
    env = zodSchema.parse(process.env);
} catch (error) {
    if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
            const path = err.path.join(".");
            console.error(`${path} - ${err.message}`);
        });
    }
    process.exit(1);
}
