import { UserScriptHeader, UserScriptHeaderProps } from '../types';

export class UserscriptHeaderFactory {
  private detail: UserScriptHeader = [];

  public push(key: keyof UserScriptHeaderProps, value: string) {
    this.detail.push([key, value]);
  }

  public create() {
    const header: string[] = [];

    header.push('// ==UserScript==');

    this.detail.forEach(([key, value]) => {
      header.push(`// ${key} ${value}`);
    });

    header.push('// ==/UserScript==');

    return header.join('\n');
  }

  public replace(key: keyof UserScriptHeaderProps, value: string) {
    this.detail.forEach(([detailKey], index) => {
      if (key === detailKey) {
        this.detail[index] = [key, value];
      }
    });
  }

  public exist(key: keyof UserScriptHeaderProps) {
    this.detail.forEach(([detailKey], index) => {
      if (key === detailKey) {
        return true;
      }
    });
    return false;
  }
}
