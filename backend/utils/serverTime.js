// Server start time for detecting server restarts on client
let SERVER_START_TIME = Date.now();

export const getServerStartTime = () => SERVER_START_TIME;

export const setServerStartTime = (time) => {
  SERVER_START_TIME = time;
};

export const resetServerStartTime = () => {
  SERVER_START_TIME = Date.now();
};
