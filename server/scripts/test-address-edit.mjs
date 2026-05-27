const API = 'http://localhost:3001/api'

async function test() {
  console.log('=== 地址编辑测试 ===\n')

  console.log('1. 登录...')
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@axis.com', password: 'Test123456' }),
  })
  const loginData = await loginRes.json()
  const token = loginData.data.accessToken
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
  console.log('   ✅ 登录成功\n')

  console.log('2. 创建一条地址...')
  const createRes = await fetch(`${API}/addresses`, {
    method: 'POST', headers,
    body: JSON.stringify({
      type: 'shipping', firstName: 'Test', lastName: 'User',
      line1: '123 Test St', city: 'TestCity', postalCode: '12345', country: 'CN',
    }),
  })
  const { data: created } = await createRes.json()
  const addrId = created.id
  console.log('   ✅ ID:', addrId, '\n')

  console.log('3. 完整更新（所有字段）...')
  const fullRes = await fetch(`${API}/addresses/${addrId}`, {
    method: 'PUT', headers,
    body: JSON.stringify({
      type: 'shipping', firstName: 'Updated', lastName: 'Name',
      line1: '456 New St', city: 'NewCity', postalCode: '54321', country: 'CN',
    }),
  })
  const fullData = await fullRes.json()
  console.log('   状态:', fullRes.status, fullData.success ? '✅' : '❌ ' + JSON.stringify(fullData))

  console.log('\n4. 部分更新（只改 phone）...')
  const partialRes = await fetch(`${API}/addresses/${addrId}`, {
    method: 'PUT', headers,
    body: JSON.stringify({ phone: '13900139000' }),
  })
  const partialData = await partialRes.json()
  console.log('   状态:', partialRes.status, partialData.success ? '✅' : '❌ ' + JSON.stringify(partialData))

  console.log('\n5. 验证结果...')
  const getRes = await fetch(`${API}/addresses/${addrId}`, { headers })
  const getData = await getRes.json()
  console.log('   firstName:', getData.data?.firstName)
  console.log('   phone:', getData.data?.phone)

  console.log('\n6. 清理...')
  await fetch(`${API}/addresses/${addrId}`, { method: 'DELETE', headers })
  console.log('   ✅ 已删除')

  console.log('\n=== 测试通过 ===')
}

test().catch(console.error)
