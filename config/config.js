module.exports = {
  data: {
    filePath: './data/togel_data.json',
    exportsPath: './exports',
    schedulerPath: './data/scheduler.json'
  },
  app: {
    supportedPasaran: ['SGP', 'HK', 'SDY'],
    patternLimit: 20,
    hotColdLimit: 30,
    defaultHistoryLimit: 10,
    maxBacktestSize: 50
  },
  formulas: {
    types: ['Mistik', 'ML', 'IX', 'M1', 'M3', 'M5', 'M7', 'M8', 'M9', 'TY']
  },
  scheduler: {
    times: {
      pagi: { hour: 9, minute: 0 },
      siang: { hour: 14, minute: 0 },
      malam: { hour: 20, minute: 0 }
    }
  }
};
