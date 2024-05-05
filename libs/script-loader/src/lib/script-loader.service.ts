import { Injectable } from '@angular/core';

@Injectable()
export class ScriptLoaderService {
  loadScript(
    id: string,
    src: string,
    onload: any,
    parentElement?: HTMLElement | null
  ): void {
    // get document if platform is only browser
    if (typeof document !== 'undefined' && !document.getElementById(id)) {
      const script = document.createElement('script');

      script.async = true;
      script.src = src;
      script.onload = onload;

      if (!parentElement) {
        parentElement = document.head;
      }

      parentElement.appendChild(script);
    }
  }
}
