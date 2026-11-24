export interface PiperPhonemizeModule {
  callMain(args: string[]): void;
}

export interface PiperPhonemizeOptions {
  print?: (data: string) => void;
  printErr?: (message: string) => void;
  locateFile?: (url: string) => string;
}

export declare function createPiperPhonemize(
  options?: PiperPhonemizeOptions,
): Promise<PiperPhonemizeModule>;
