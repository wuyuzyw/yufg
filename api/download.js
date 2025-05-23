import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async (req, res) => {
  const { filename } = req.query;

  // 1. 查询下载限制
  const { data, error } = await supabase
    .from('file_downloads')
    .select('*')
    .eq('filename', filename)
    .single();

  if (error || data.current_downloads >= data.max_downloads) {
    return res.status(403).json({ error: '下载次数已达上限' });
  }

  // 2. 生成下载链接
  const { data: url } = supabase.storage
    .from('files')
    .getPublicUrl(filename);

  // 3. 原子更新计数器
  await supabase
    .from('file_downloads')
    .update({ current_downloads: data.current_downloads + 1 })
    .eq('filename', filename);

  // 4. 返回下载链接（或直接重定向）
  res.json({ url: url.publicUrl });
};