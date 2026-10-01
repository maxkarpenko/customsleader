/** Server-side adapter, intentionally not connected to the local demo. */
export async function createBitrixLead(payload, webhookUrl = process.env.BITRIX24_WEBHOOK_URL) {
  if (!webhookUrl) throw new Error('Bitrix24 is not configured');
  if (payload.consent !== 'on' || !/^[+\d() \-]{7,25}$/.test(payload.phone || '')) throw new Error('Invalid lead');
  if (!['hero','final','detailed','callback','russia'].includes(payload.form)) throw new Error('Invalid form');
  if (['detailed','callback','russia'].includes(payload.form) && !payload.name?.trim()) throw new Error('Name is required');
  if (payload.form === 'detailed' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || '')) throw new Error('Email is required');
  const fields = {
    TITLE: `Заявка с сайта — ${payload.form}`,
    NAME: String(payload.name || '').slice(0,200),
    COMPANY_TITLE: String(payload.company || '').slice(0,300),
    PHONE: [{VALUE: payload.phone, VALUE_TYPE: 'WORK'}],
    ...(payload.email ? {EMAIL:[{VALUE:payload.email, VALUE_TYPE:'WORK'}]} : {}),
    COMMENTS: ['services','cargo','oversized','direction','deadline','origin','destination','message','inn'].filter(k=>payload[k]).map(k=>`${k}: ${String(payload[k]).slice(0,3000)}`).join('\n'),
    SOURCE_ID: 'WEB',
  };
  const url=new URL('crm.lead.add.json',webhookUrl.endsWith('/')?webhookUrl:`${webhookUrl}/`);
  if(url.protocol!=='https:')throw new Error('HTTPS webhook is required');
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields}),signal:AbortSignal.timeout(15000)});
  const result=await response.json();
  if(!response.ok || result.error || !result.result)throw new Error('CRM submission failed');
  return {ok:true};
}
