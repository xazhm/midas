const fs = require('fs');
const axios = require('axios');

async function readInitDataFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const initDataArray = data.trim().split('\n').map(line => line.trim());
        resolve(initDataArray);
      }
    });
  });
}

async function getToken(initData) {
  try {
    const response = await axios.post('https://api-tg-app.midas.app/api/auth/register', {
      initData: initData,
      source: ' '
    }, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Origin': 'https://midas-tg-app.netlify.app',
        'X-Requested-With': 'org.telegram.messenger'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error response data:', error.response ? error.response.data : 'N/A');
    console.error('Error response status:', error.response ? error.response.status : 'N/A');
    console.error('Error response headers:', error.response ? error.response.headers : 'N/A');
    throw new Error('Error fetching token: ' + (error.response ? error.response.data : error.message));
  }
}

async function getUserInfo(token) {
  try {
    const response = await axios.get('https://api-tg-app.midas.app/api/user', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`, 
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error('Error fetching user info: ' + error.message);
  }
}

async function getStreakInfo(token) {
  try {
    const response = await axios.get('https://api-tg-app.midas.app/api/streak', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`, 
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error('Error fetching streak info: ' + error.message);
  }
}

async function claimStreakInfo(token) {
  try {
    const response = await axios.post('https://api-tg-app.midas.app/api/streak', null, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://midas-tg-app.netlify.app'
      }
    });
    console.log('\nClaim Streak: Done');
  } catch (error) {
    console.error('\nClaim Streak Reward: Telah diambil!');
  }
}

async function getTasksInfo(token) {
  try {
    const response = await axios.get('https://api-tg-app.midas.app/api/tasks/available', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error('Error fetching tasks info: ' + error.message);
  }
}

async function startTask(token, taskId) {
  try {
    const response = await axios.post(`https://api-tg-app.midas.app/api/tasks/start/${taskId}`, null, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`, 
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return { success: true, taskId };
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.error(`[X] Error starting task: ${taskId}. Manual check app Midas mu!`);
      return { success: false, taskId };
    } else {
      throw new Error('[X] Error starting task: ' + error.message);
    }
  }
}

async function claimTask(token, taskId) {
  try {
    const response = await axios.post(`https://api-tg-app.midas.app/api/tasks/claim/${taskId}`, null, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`, 
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log(`[>] Task ID: ${taskId}`);
    return { success: true, taskId };
  } catch (error) {
    console.error(`[-] Error claiming task: ${taskId}. Manual check app Midas mu!`);
    return { success: false, taskId };
  }
}

async function playGameUntilTicketsZero(token) {
  try {
    while (true) {
      const userInfo = await getUserInfo(token);
      if (userInfo.tickets <= 0) {
        break;
      }
      
      console.log(`Playing game to use ticket. Current tickets: ${userInfo.tickets}`);
      try {
        await axios.post('https://api-tg-app.midas.app/api/game/play', null, {
          headers: {
            'Authorization': `Bearer ${token.trim()}`,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
      } catch (error) {
        console.error('Error playing game: ' + error.message);
        break;
      }

      await delay(5000); 
    }
  } catch (error) {
    throw new Error('Error playing game: ' + error.message);
  }
}

async function checkAndClaimReferral(token) {
  try {
    const response = await axios.get('https://api-tg-app.midas.app/api/referral/referred-users', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`, 
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (response.data.length === 0) {
      console.log('\nReferral:\n-');
    } else {
      console.log('\nReferral:\n(Ada Referral)');

      try {
        await axios.post('https://api-tg-app.midas.app/api/referral/claim', null, {
          headers: {
            'Authorization': `Bearer ${token.trim()}`, 
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        console.log('CLAIM REFERRAL SUCCESS');
      } catch (claimError) {
        console.error('Error claiming referral: Referral Reward sudah diambil!');
      }
    }
  } catch (error) {
    throw new Error('Error fetching referral info: ' + error.message);
  }
}

async function processAccount(initData) {
  try {
    const token = await getToken(initData);
    console.log('Token acquired for initData:', initData);

    const userInfo = await getUserInfo(token);
    await claimStreakInfo(token); 

    if (userInfo.tickets >= 0) {
      console.log(`\nTickets available: ${userInfo.tickets}.`);
      await playGameUntilTicketsZero(token);
    }

    const streakInfo = await getStreakInfo(token);
    
    await checkAndClaimReferral(token);

    const tasksInfo = await getTasksInfo(token);

    const userOutput = `\nUSERNAME: ${userInfo.username || 'null'} | POINTS: ${userInfo.points} | TICKETS: ${userInfo.tickets}\nStreak Start Date: ${streakInfo.streakStartDate}\nStreak Days Count: ${streakInfo.streakDaysCount}`;
    console.log(userOutput);

    const failedTasks = [];
    console.log('\nTasks List:');
    for (const task of tasksInfo) {
      const completionStatus = task.completed ? 'SUDAH DIKERJAKAN' : 'BELUM DIKERJAKAN';
      console.log(`[>] ${task.name} | ${task.mechanic} | ${completionStatus}`);

      if (!task.completed && task.id !== 'connect_wallet') {
        console.log(`[V] Starting task: ${task.id}`);
        const result = await startTask(token, task.id);
        if (!result.success) {
          failedTasks.push(result.taskId);
        }
      }
    }

    if (failedTasks.length > 0) {
      console.log('\nTASKS YANG GAGAL:');
      failedTasks.forEach(taskId => console.log(`[-] Task ID: ${taskId}`));
    }

    console.log('\n[MENUNGGU 15 DETIK UNTUK CLAIM TASKS]');
    await delay(15000);
    for (const task of tasksInfo) {
      if (!task.completed && task.id !== 'connect_wallet') {
        console.log(`[>] Task ID: ${task.id}`);
        await claimTask(token, task.id);
      }
    }
  } catch (error) {
    console.error('Error processing account:', error.message);
  }
}

async function main() {
  try {
    const initDataArray = await readInitDataFromFile('ey.txt');

    while (true) {
      for (const initData of initDataArray) {
        console.log(`========================================`);
        console.log(`Processing initData: ${initData}`);

        try {
          await processAccount(initData);
        } catch (error) {
          console.error(`Failed to process initData: ${initData}. Error: ${error.message}`);
        }
      }
      console.log(`\n========================================`);
      console.log('Menunggu selama 12 jam sebelum memulai ulang...');
      await delay(12 * 60 * 60 * 1000); 
    }
  } catch (error) {
    console.error('Error reading initData from file:', error.message);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();
