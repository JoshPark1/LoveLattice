const url = "https://instagram.fdac174-1.fna.fbcdn.net/v/t51.2885-19/573323465_1219825463302212_7278921664109726296_n.png?stp=dst-jpg_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4yMjQuYzIifQ&_nc_ht=instagram.fdac174-1.fna.fbcdn.net&_nc_cat=100&_nc_oc=Q6cZ2QFD3Xx6kjwac6us7opP_f_9TG3QjSFdlqgZk04eSgxPu-XL1JJlugMd7mwY48_St_g&_nc_ohc=2tyZ8HJj7tUQ7kNvwEh85xA&edm=AAAAAAABAAAA&ccb=7-5&ig_cache_key=YW5vbnltb3VzX3Byb2ZpbGVfcGlj.3-ccb7-5&oh=00_AfyAIMCHzFFrLjrRsTSkU1_nFQjdPf45C_aBQbbfr_IGnw&oe=69B6A3AA&_nc_sid=328259";
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(res => res.arrayBuffer())
  .then(buf => console.log('Fetched bytes:', buf.byteLength))
  .catch(err => console.error(err));
