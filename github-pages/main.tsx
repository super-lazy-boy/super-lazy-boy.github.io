import { createRoot } from "react-dom/client";
import ConnectedRoom from "./ConnectedRoom";
import { parsePublicRecords } from "../lib/public-records";
import data from "../content/public-records.json";
import "../app/globals.css";

const records=parsePublicRecords(data);
const returnZone=sessionStorage.getItem('room-login-zone');
if(new URLSearchParams(location.search).has('code')&&returnZone&&/^#(overview|office|books|cinema|guestbook)$/.test(returnZone)){
  history.replaceState(null,'',location.pathname+location.search+returnZone);
}
createRoot(document.getElementById("root")!).render(<ConnectedRoom records={records}/>);
