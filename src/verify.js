function verify(name) {
  let r = request(HYPIXEL_API_DATA, HYPIXEL_API_KEY, name);
  return r["playerName"] == name;
}
