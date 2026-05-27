const API = 'http://localhost:3001/api'

async function test() {
  console.log('=== AXIS O 地址管理 API 测试 ===\n')

  console.log('--- Step 1: 登录获取 Token ---')
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@axis.com', password: 'Test123456' }),
  })
  const loginData = await loginRes.json()
  console.log('登录状态:', loginRes.status)
  if (!loginData.success) {
    console.error('登录失败:', loginData.error)
    return
  }
  const token = loginData.data.accessToken
  console.log('Token 获取成功:', token.substring(0, 30) + '...\n')

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  console.log('--- Step 2: 清空已有地址（确保测试干净） ---')
  let listRes = await fetch(`${API}/addresses`, { headers })
  let listData = await listRes.json()
  if (listData.success && listData.data?.addresses) {
    for (const addr of listData.data.addresses) {
      await fetch(`${API}/addresses/${addr.id}`, { method: 'DELETE', headers })
    }
  }
  console.log('✅ 已清空')

  console.log('\n--- Step 3: 创建地址 1 ---')
  const addr1Res = await fetch(`${API}/addresses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'shipping',
      firstName: '张',
      lastName: '三',
      line1: '朝阳区建国路88号',
      line2: 'SOHO现代城A座1201',
      city: '北京',
      state: '北京',
      postalCode: '100022',
      country: 'CN',
      phone: '13800138001',
      isDefault: false,
    }),
  })
  const addr1Data = await addr1Res.json()
  console.log('状态:', addr1Res.status, addr1Res.status === 201 ? '✅' : '❌')
  console.log('响应:', JSON.stringify(addr1Data))

  console.log('\n--- Step 4: 创建地址 2（默认） ---')
  const addr2Res = await fetch(`${API}/addresses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'shipping',
      firstName: '李',
      lastName: '四',
      line1: '浦东新区陆家嘴环路1000号',
      city: '上海',
      state: '上海',
      postalCode: '200120',
      country: 'CN',
      phone: '13800138002',
      isDefault: true,
    }),
  })
  const addr2Data = await addr2Res.json()
  console.log('状态:', addr2Res.status, addr2Res.status === 201 ? '✅' : '❌')
  console.log('响应:', JSON.stringify(addr2Data))

  console.log('\n--- Step 5: 获取地址列表 ---')
  listRes = await fetch(`${API}/addresses`, { headers })
  listData = await listRes.json()
  console.log('状态:', listRes.status, listRes.status === 200 ? '✅' : '❌')
  if (listData.success) {
    const addrs = listData.data.addresses
    console.log(`地址数量: ${addrs.length}`)
    addrs.forEach((a, i) => {
      console.log(`  [${i}] ${a.firstName}${a.lastName} | ${a.line1}, ${a.city} | 默认:${a.isDefault}`)
    })
  } else {
    console.log('响应:', JSON.stringify(listData))
  }

  console.log('\n--- Step 6: 更新地址 1 ---')
  let addr1Id = ''
  if (listData.success) {
    addr1Id = listData.data.addresses.find((a) => a.isDefault === 0)?.id || ''
  }
  if (addr1Id) {
    const updateRes = await fetch(`${API}/addresses/${addr1Id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        firstName: '张',
        lastName: '三（已更新）',
        line1: '海淀区中关村大街1号',
        city: '北京',
        state: '北京',
        postalCode: '100080',
        country: 'CN',
        phone: '13900139001',
      }),
    })
    const updateData = await updateRes.json()
    console.log('状态:', updateRes.status, updateRes.status === 200 ? '✅' : '❌')
    console.log('响应:', JSON.stringify(updateData))
  }

  console.log('\n--- Step 7: 设地址 1 为默认 ---')
  if (addr1Id) {
    const defRes = await fetch(`${API}/addresses/${addr1Id}/default`, {
      method: 'PUT',
      headers,
    })
    const defData = await defRes.json()
    console.log('状态:', defRes.status, defRes.status === 200 ? '✅' : '❌')
    console.log('响应:', JSON.stringify(defData))
  }

  console.log('\n--- Step 8: 验证默认地址切换 ---')
  listRes = await fetch(`${API}/addresses`, { headers })
  listData = await listRes.json()
  if (listData.success) {
    const addrs = listData.data.addresses
    addrs.forEach((a, i) => {
      console.log(`  [${i}] ${a.firstName}${a.lastName} | ${a.line1} | 默认:${a.isDefault}`)
    })
    const defaultCount = addrs.filter((a) => a.isDefault === 1).length
    console.log(`默认地址数量: ${defaultCount} ${defaultCount === 1 ? '✅' : '❌ (应为1)'}`)
  }

  console.log('\n--- Step 9: 删除地址 1 ---')
  if (addr1Id) {
    const delRes = await fetch(`${API}/addresses/${addr1Id}`, { method: 'DELETE', headers })
    const delData = await delRes.json()
    console.log('状态:', delRes.status, delRes.status === 200 ? '✅' : '❌')
    console.log('响应:', JSON.stringify(delData))
  }

  console.log('\n--- Step 10: 删除后验证 ---')
  listRes = await fetch(`${API}/addresses`, { headers })
  listData = await listRes.json()
  if (listData.success) {
    const addrs = listData.data.addresses
    console.log(`剩余地址数: ${addrs.length} ${addrs.length === 1 ? '✅' : '❌ (应为1)'}`)
    if (addrs.length > 0) {
      console.log(`  [0] ${addrs[0].firstName}${addrs[0].lastName} | ${addrs[0].line1}`)
    }
  }

  console.log('\n=== 测试完成 ===')
}

test().catch(console.error)
