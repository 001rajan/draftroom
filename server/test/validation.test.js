import test from "node:test";
import assert from "node:assert/strict";
import {validateChallenge,validateProfile,validateReport,validateSubmission} from "../src/validation.js";

test("profile validation accepts valid profiles and rejects oversized bios",()=>{
  assert.equal(validateProfile({username:"Rajan",bio:"Writer"}),null);
  assert.match(validateProfile({username:"R",bio:""}),/Name/);
  assert.match(validateProfile({username:"Rajan",bio:"x".repeat(501)}),/Bio/);
});

test("challenge validation requires a valid chronological window",()=>{
  assert.equal(validateChallenge({title:"Flash fiction",prompt:"Write a short story",startsAt:"2026-10-01",endsAt:"2026-11-01"}),null);
  assert.match(validateChallenge({title:"Prompt",prompt:"Text",startsAt:"2026-11-01",endsAt:"2026-10-01"}),/after its start/);
});

test("submission validation checks title and story text",()=>{
  assert.equal(validateSubmission({title:"A beginning",body:"Once upon a time"}),null);
  assert.match(validateSubmission({title:"",body:"Text"}),/title/);
  assert.match(validateSubmission({title:"Story",body:"  "}),/text/);
});

test("report validation only accepts supported reasons",()=>{
  assert.equal(validateReport({reason:"copyright",details:"Original source"}),null);
  assert.match(validateReport({reason:"made-up"}),/reason/);
});