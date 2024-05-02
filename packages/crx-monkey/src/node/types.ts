import { BuildOptions } from 'esbuild';
import { Options } from 'prettier';

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
  userscriptInjectPage: string[];
  prettier: CrxPrettierOptions;
}

export interface CrxPrettierOptions {
  format: boolean;
  options: Options;
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

export interface CrxMonkeyManifest extends chrome.runtime.ManifestV3 {
  content_scripts: CrxMonkeyContentScripts | undefined;
}

export type CrxMonkeyContentScripts = Array<{
  matches?: string[] | undefined;
  exclude_matches?: string[] | undefined;
  css?: string[] | undefined;
  js?: string[] | undefined;
  run_at?: string | undefined;
  all_frames?: boolean | undefined;
  match_about_blank?: boolean | undefined;
  include_globs?: string[] | undefined;
  exclude_globs?: string[] | undefined;
  world?: 'ISOLATED' | 'MAIN' | undefined;

  connection_isolated?: boolean;
}>;
