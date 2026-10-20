import { createRoot } from "react-dom/client";
import RoomApp from "../components/room/RoomApp";
import { parsePublicRecords } from "../lib/public-records";
import data from "../content/public-records.json";
import "../app/globals.css";

const records=parsePublicRecords(data);
createRoot(document.getElementById("root")!).render(<RoomApp publishedRecords={records}/>);
