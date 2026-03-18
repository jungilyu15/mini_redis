function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getSlowData(id: string) {
  await sleep(80);
  return {
    id,
    score: id.length * 7,
    generatedAt: new Date().toISOString()
  };
}
