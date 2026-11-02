import test from "node:test";
import assert from "node:assert/strict";

import { getVoteButtonLabel, getVoteButtonCaption } from "../components/vote-button";

test("vote button label and caption reflect confirmed state", () => {
  assert.equal(getVoteButtonLabel({ count: 0, isConfirmed: false }), "Harga masih sama");
  assert.equal(getVoteButtonLabel({ count: 12, isConfirmed: true }), "Terkonfirmasi");
  assert.equal(getVoteButtonCaption({ count: 0, isConfirmed: false }), "0 konfirmasi");
  assert.equal(getVoteButtonCaption({ count: 12, isConfirmed: true }), "12 konfirmasi");
});
