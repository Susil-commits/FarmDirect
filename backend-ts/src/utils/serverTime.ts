let SERVER_START_TIME = Date.now();

export function getServerStartTime(): number {
  return SERVER_START_TIME;
}

export function setServerStartTime(time: number): void {
  SERVER_START_TIME = time;
}

export function resetServerStartTime(): void {
  SERVER_START_TIME = Date.now();
}
