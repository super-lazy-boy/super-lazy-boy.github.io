import test from "node:test";
import assert from "node:assert/strict";
import {parsePublicRecords} from "../lib/public-records.ts";
const record={id:"reading-001",kind:"book",title:"公开书目"};
const doc=(records)=>({version:1,records});
test("empty public collection and minimal record are valid",()=>{
  assert.deepEqual(parsePublicRecords(doc([])),[]);
  const [result]=parsePublicRecords(doc([record]));
  assert.equal(result.visibility,"public");
  assert.equal(result.coverKey,"");
  assert.equal(result.memorialNote,"");
});
test("private data and server exports cannot silently become public",()=>{
  for(const extra of [{visibility:"private"},{ownerId:"owner"},{coverKey:"secret"},{modelKey:"secret"},{memorialNote:"private note"},{archived:true}]){
    assert.throws(()=>parsePublicRecords(doc([{...record,...extra}])));
  }
});
test("duplicate identities and book positions are rejected",()=>{
  assert.throws(()=>parsePublicRecords(doc([record,record])));
  assert.throws(()=>parsePublicRecords(doc([{...record,slot:0},{...record,id:"reading-002",slot:0}])));
});
test("public assets use portable URLs without private API paths",()=>{
  assert.equal(parsePublicRecords(doc([{...record,coverUrl:"./media/book.jpg"}]))[0].coverUrl,"./media/book.jpg");
  for(const coverUrl of ["/api/assets/private","./media/../secret.png","file:///D:/secret.png","javascript:alert(1)"]){
    assert.throws(()=>parsePublicRecords(doc([{...record,coverUrl}])));
  }
});
