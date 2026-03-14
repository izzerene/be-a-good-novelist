
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Removed global getAI helper and updated all functions to instantiate GoogleGenAI strictly following the SDK guidelines
export const getDailyMotivation = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "请为一位刚开始一天工作的作家生成一段简短、富有诗意且极具激励性的名言。请以 JSON 对象形式返回，包含 'quote' (名言) 和 'author' (作者)。请使用中文。",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          author: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const generateWritingPrompt = async (type: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemPrompt = type === 'random' 
    ? `你现在是创意写作书《666件可写的事》的作者。请生成一个脑洞大开、具有极强戏剧冲突或反直觉的写作练习。
       参考范例：
       1. 早上醒来，忽然发现自己转换了性别。
       2. 一个从35层跳楼轻生的人，在半空中是否会后悔？为什么？
       3. 有一天，你不经意间在你的室友枕头下发现了一把水果刀。
       4. 如果你可以进入游戏世界，你想在哪款游戏里生活？
       5. 坐在你身旁的那个人突然变成丧尸，之后会发生什么？
       
       请返回中文 JSON，包含 'title' (简短标题) 和 'prompt' (具体题目)，并随机生成一个 1 到 666 之间的 'number'。`
    : `请生成一个创意写作练习，类型为: ${type}。请使用中文。返回 JSON 格式，包含 'title' 和 'prompt' 字段。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: systemPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          prompt: { type: Type.STRING },
          number: { type: Type.INTEGER, description: "题目编号" },
          words: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const getAIWritingAssistant = async (context: string, currentContent: string, instruction: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `故事背景: ${context}\n\n当前文本: ${currentContent}\n\n任务: ${instruction}`,
    config: {
      systemInstruction: "你是一位顶尖的虚构写作助手。回复语言必须为中文。文风优雅、专业。"
    }
  });
  return response.text;
};

export const generateImagePrompt = async (description: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A cinematic, atmospheric illustration for this story prompt: ${description}. Muted tones, high quality.` }]
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateCharacterAvatar = async (name: string, bio: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A high-quality, professional digital character portrait for a story character named "${name}". Description: ${bio}. Style: cinematic, artistic concept art, clean background, 1:1 aspect ratio.` }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
