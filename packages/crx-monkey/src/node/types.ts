import { BuildOptions } from 'esbuild';

export interface CrxMonkeyConfig {
  manifestJsonPath: string;
  chromeOutputDir: string;
  userscriptOutput: string;
  esBuildOptions: BuildOptions;
  devServer: {
    port: number;
    host: string;
    websocket: number;
  };
  publicDir: string;
  userScriptHeader: UserScriptHeader;
  importIconToUsercript: boolean;
}

export type NonLoadedCrxMonkeyConfig = {
  [key in keyof CrxMonkeyConfig]?: CrxMonkeyConfig[key];
};

export type UserScriptHeader = Array<[keyof UserScriptHeaderProps, string]>;

export interface UserScriptHeaderProps {
  '@name': string;
  '@namespace'?: string;
  '@copyright'?: string;
  '@version': string;
  '@description'?: string;
  '@icon'?: string;
  '@iconURL'?: string;
  '@defaulticon'?: string;
  '@icon64'?: string;
  '@icon64URL'?: string;
  '@grant'?: string;
  '@author'?: string;
  '@homepage'?: string;
  '@homepageURL'?: string;
  '@website'?: string;
  '@source'?: string;
  '@antifeature'?: string;
  '@require'?: string;
  '@resource'?: string;
  '@include'?: string;
  '@match'?: string;
  '@exclude'?: string;
  '@run-at'?: string;
  '@sandbox'?: string;
  '@connect'?: string;
  '@noframes'?: string;
  '@updateURL'?: string;
  '@downloadURL'?: string;
  '@supportURL'?: string;
  '@webRequest'?: string;
  '@unwrap'?: string;
  [key: string]: string | undefined;
}
