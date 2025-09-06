declare global {
  interface Window {
    api: import('./common/ipc').RendererApis;
  }
}

const root = document.getElementById('root')!;
root.innerHTML = `
  <header style="padding:8px;border-bottom:1px solid #ddd">
    <button id="open">Open</button>
    <button id="save">Save</button>
    <span id="pong" style="margin-left:12px;color:#666"></span>
  </header>
  <textarea id="editor" style="width:100%;height:calc(100vh - 60px);border:0;outline:none;padding:12px">// hello</textarea>
`;

(async () => {
  (document.getElementById('pong')!).textContent = await window.api.ping('hello');

  window.api.onThemeChanged((t) => {
    document.documentElement.dataset.theme = t;
  });

  document.getElementById('open')!.addEventListener('click', async () => {
    const f = await window.api.openFile();
    if (f) (document.getElementById('editor') as HTMLTextAreaElement).value = f.content;
  });

  document.getElementById('save')!.addEventListener('click', async () => {
    const content = (document.getElementById('editor') as HTMLTextAreaElement).value;
    await window.api.saveFile({ content });
  });
})();