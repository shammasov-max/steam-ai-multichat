// @app/isomorphic/commands.ts

// ⬇️ удалён ImportTasksCSV; добавлены CreateTask и DisposeTask

export type AddBotFromMaFile = {
    type: "AddBotFromMaFile";
    payload: { maFileJSON: string; proxyUrl: string; label?: string };
  };
  
  export type RemoveBot = {
    type: "RemoveBot";
    payload: { botId: string };
  };
  
  export type ToggleAgent = {
    type: "ToggleAgent";
    payload: { chatId: string; enabled: boolean };
  };
  
  export type SendMessage = {
    type: "SendMessage";
    payload: { chatId: string; text: string };
  };
  
  // ✅ NEW
  export type CreateTask = {
    type: "CreateTask";
    payload: {
      taskId?: string;               // если не передан — сгенерируем на бэке
      playerSteamId64: string;
      item: string;
      priceMin: number;
      priceMax: number;
    };
  };
  
  // ✅ NEW
  export type DisposeTask = {
    type: "DisposeTask";
    payload: {
      taskId: string;
      reason?: string;               // опционально — для аудита/логов
    };
  };
  
  export type Command =
    | AddBotFromMaFile
    | RemoveBot
    | ToggleAgent
    | SendMessage
    | CreateTask        // ← добавлено
    | DisposeTask;      // ← добавлено
  
  export type CommandResult =
    | { ok: true }
    | { ok: false; error: string };
  