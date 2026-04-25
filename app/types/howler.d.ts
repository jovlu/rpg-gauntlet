declare module "howler" {
  export class Howl {
    constructor(options: {
      src: string[];
      autoplay?: boolean;
      format?: string[];
      html5?: boolean;
      loop?: boolean;
      volume?: number;
    });

    play(id?: number | string): number;
    playing(id?: number | string): boolean;
  }
}
