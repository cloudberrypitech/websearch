import { openChromeTab } from "webdevelop";

document.getElementById('openLinkBtn').addEventListener('click', getInputText());

function getInputText() {
  var inputTextElement = document.getElementById('textInput');
  var elem = inputTextElement.value;
  try {
    const tab = await openChromeTab(elem);
    console.log(tab.id);
  } catch (error) {
    console.error(error.message)
  }
}