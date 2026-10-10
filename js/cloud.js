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
    var priv = { v: 1, money: S.money };
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

  /* ほかの人の部屋を見る */
  KC.fetchRoom = function (id) {
    return sb.from('profiles').select('nickname,data').eq('id', id).maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  };
})();
