import OpenAI from "openai";

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateNextAction(taskTitle: string): Promise<string> {
    const prompt = `Break this task into two very specific steps:\n\nTask: ${taskTitle}\n\nFormat:\n1.\n2.`;
    const res = await openai.completions.create({
        model: "text-davinci-003",
        prompt,
        max_tokens: 60,
        temperature: 0.7,
    });
    return res.choices[0].text?.trim() ?? "";
}
