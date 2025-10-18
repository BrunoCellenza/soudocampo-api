import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Max-Age', '86400');


  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const { data, error } = await supabase
      .from('newsletter')
      .insert([{ email, inscrito_em: new Date().toISOString() }])
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      throw error;
    }

    try {
      await resend.emails.send({
        from: 'Sou do Campo <onboarding@resend.dev>',
        to: [email],
        subject: 'Bem-vindo ao Sou do Campo!',
        html: '<h1>Obrigado por se inscrever!</h1><p>Você receberá as últimas novidades sobre produtos rurais.</p>'
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    res.status(201).json({ message: 'Email cadastrado com sucesso', data });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
