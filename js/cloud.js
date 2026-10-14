/* キラペン — cloud.js
   Supabase でログインと My Room の保存をする。
   ここに書くのは公開してよいキー（publishable key）だけ。secret key は絶対に書かない。 */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://zufkphrjmboprpwugfkm.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_4AFjcye6GSqNNMh2FtD4Qw_uDLGJjHJ';

  var KC = { ready: false, loaded: false, user: null, status: '', error: '' };
  var listeners = [];
  KC.onChange = function (fn) { listeners.push(fn); };
  function emit() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
  window.KC = KC;

  if (!window.supabase || !window.supabase.createClient) { KC.loaded = true; return; }
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  KC.ready = true;

  sb.auth.getSession().then(function (r) {
    KC.user = r.data && r.data.session ? r.data.session.user : null; KC.loaded = true; emit();
  }, function () { KC.loaded = true; emit(); });
  sb.auth.onAuthStateChange(function (ev, session) {
    var before = KC.user ? KC.user.id : null;
    KC.user = session ? session.user : null;
    if ((KC.user ? KC.user.id : null) !== before) { KC.justSignedIn = !!KC.user && ev === 'SIGNED_IN'; emit(); }
  });

  function msg(err) {
    var m = (err && (err.message || err.error_description)) || '';
    if (/Invalid login credentials/i.test(m)) return 'メールアドレスかパスワードがちがいます';
    if (/already registered|already been registered|User already/i.test(m)) return 'このメールアドレスはもう登録されています。ログインしてね';
    if (/Password should be|at least/i.test(m)) return 'パスワードは6文字以上にしてね';
    if (/Email not confirmed/i.test(m)) return '確認メールのリンクを押してから、ログインしてね';
    if (/rate limit|too many/i.test(m)) return '少し時間をおいてから、もう一度試してね';
    if (/Failed to fetch|NetworkError|network/i.test(m)) return '通信できませんでした。電波のよい場所で試してね';
    return m || 'うまくいきませんでした';
  }
  KC.message = msg;

  KC.signUp = function (email, pw) {
    return sb.auth.signUp({ email: email, password: pw, options: { emailRedirectTo: location.origin + location.pathname } })
      .then(function (r) { if (r.error) throw r.error; return { needConfirm: !r.data.session }; });
  };
  KC.signIn = function (email, pw) {
    return sb.auth.signInWithPassword({ email: email, password: pw }).then(function (r) { if (r.error) throw r.error; return r.data; });
  };
  KC.signOut = function () { return sb.auth.signOut(); };

  /* サーバーにあるデータを取ってくる（なければ null） */
  KC.pull = function () {
    var id = KC.user.id;
    return Promise.all([
      sb.from('profiles').select('data,updated_at').eq('id', id).maybeSingle(),
      sb.from('private_data').select('data').eq('id', id).maybeSingle()
    ]).then(function (r) {
      if (r[0].error) throw r[0].error; if (r[1].error) throw r[1].error;
      if (!r[0].data) return null;
      return { pub: r[0].data.data || {}, priv: (r[1].data && r[1].data.data) || {}, updatedAt: r[0].data.updated_at };
    });
  };

  /* 今のデータをサーバーに保存する */
  KC.push = function (S) {
    if (!KC.user) return Promise.resolve();
    var id = KC.user.id, now = new Date().toISOString();
    var pub = { v: 1, me: S.me, oshis: S.oshis, room: S.room };
    var priv = { v: 1, money: S.money, events: S.events || [] };
    return sb.from('profiles').upsert({ id: id, nickname: String(S.me.name || '').slice(0, 24), data: pub, updated_at: now })
      .then(function (r) { if (r.error) throw r.error; return sb.from('private_data').upsert({ id: id, data: priv, updated_at: now }); })
      .then(function (r) { if (r.error) throw r.error; });
  };

  var timer = null, pending = null;
  KC.schedulePush = function (S) {
    if (!KC.user || KC.paused) return;
    pending = S; clearTimeout(timer);
    KC.status = 'saving'; emit();
    timer = setTimeout(function () {
      KC.push(pending).then(function () { KC.status = 'saved'; KC.error = ''; emit(); },
        function (e) { KC.status = 'error'; KC.error = msg(e); emit(); });
    }, 1500);
  };

  /* ---------- 投稿・タイムライン ---------- */
  var BUCKET = 'post-images';
  function need() { if (!KC.user) throw new Error('ログインしてね'); return KC.user.id; }
  function ok(r) { if (r.error) throw r.error; return r.data; }

  KC.isAdmin = false;
  KC.checkAdmin = function () {
    if (!KC.user) { KC.isAdmin = false; return Promise.resolve(false); }
    return sb.from('admins').select('user_id').eq('user_id', KC.user.id).maybeSingle()
      .then(function (r) { KC.isAdmin = !r.error && !!r.data; emit(); return KC.isAdmin; }, function () { return false; });
  };
  KC.onChange(function () { if (KC.user && !KC._adminChecked) { KC._adminChecked = true; KC.checkAdmin(); } if (!KC.user) { KC._adminChecked = false; KC.isAdmin = false; } });

  KC.imageUrl = function (path) { return path ? sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : ''; };

  KC.fetchPosts = function (o) {
    o = o || {};
    var q = sb.from('posts')
      .select('id,kind,body,image_path,oshi,oshi_color,created_at,user_id,hidden,profiles(nickname,me:data->me),likes(count)')
      .order('created_at', { ascending: false }).limit(o.limit || 20);
    if (o.oshi) q = q.eq('oshi', o.oshi);
    if (o.user) q = q.eq('user_id', o.user);
    if (o.before) q = q.lt('created_at', o.before);
    return q.then(ok);
  };
  KC.myLikes = function (ids) {
    if (!KC.user || !ids.length) return Promise.resolve([]);
    return sb.from('likes').select('post_id').eq('user_id', KC.user.id).in('post_id', ids).then(ok)
      .then(function (rows) { return rows.map(function (r) { return r.post_id; }); });
  };
  KC.like = function (postId, on) {
    var id = need();
    return (on ? sb.from('likes').insert({ post_id: postId, user_id: id }) : sb.from('likes').delete().eq('post_id', postId).eq('user_id', id))
      .then(function (r) { if (r.error && r.error.code !== '23505') throw r.error; });
  };
  KC.uploadImage = function (blob) {
    var id = need(), path = id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.jpg';
    return sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      .then(function (r) { if (r.error) throw r.error; return path; });
  };
  KC.createPost = function (p) {
    var id = need();
    var row = { user_id: id, kind: p.kind, body: p.body, image_path: p.image_path || null, oshi: p.oshi || null, oshi_color: p.oshi_color || null };
    return sb.from('posts').insert(row).select('id,kind,body,image_path,oshi,oshi_color,created_at,user_id,hidden').single().then(ok);
  };
  KC.deletePost = function (post) {
    need();
    return sb.from('posts').delete().eq('id', post.id).then(ok).then(function () {
      if (post.image_path) sb.storage.from(BUCKET).remove([post.image_path]).then(function () {}, function () {});
    });
  };
  KC.report = function (postId, reason) {
    var id = need();
    return sb.from('reports').insert({ post_id: postId, reporter: id, reason: reason })
      .then(function (r) { if (r.error && r.error.code !== '23505') throw r.error; });
  };
  KC.myBlocks = function () {
    if (!KC.user) return Promise.resolve([]);
    return sb.from('blocks').select('blocked').eq('blocker', KC.user.id).then(ok)
      .then(function (rows) { return rows.map(function (r) { return r.blocked; }); });
  };
  KC.block = function (uid) {
    var id = need();
    return sb.from('blocks').insert({ blocker: id, blocked: uid }).then(function (r) { if (r.error && r.error.code !== '23505') throw r.error; });
  };
  KC.unblock = function (uid) { var id = need(); return sb.from('blocks').delete().eq('blocker', id).eq('blocked', uid).then(ok); };

  /* 運営だけ */
  KC.adminReports = function () {
    return sb.from('reports')
      .select('id,reason,created_at,post_id,posts(id,kind,body,image_path,oshi,hidden,user_id,created_at,profiles(nickname))')
      .order('created_at', { ascending: false }).limit(200).then(ok);
  };
  KC.adminKeep = function (postId) {
    return sb.from('posts').update({ hidden: false }).eq('id', postId).then(ok)
      .then(function () { return sb.from('reports').delete().eq('post_id', postId).then(ok); });
  };

  /* ほかの人の部屋を見る */
  KC.fetchRoom = function (id) {
    return sb.from('profiles').select('nickname,data').eq('id', id).maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  };
})();
