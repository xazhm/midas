const fs = require('fs');
const axios = require('axios');

function readTokensFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const tokens = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        resolve(tokens);
      }
    });
  });
}

async function getUserInfo(token) {
  try {
    const response = await axios.get('https://api-tg-app.midas.app/api/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStreakInfo(token) {
  try {
    const response = await axios.get('https://api-tg-app.midas.app/api/streak', {
      headers: {
        'Authorization': `Bearer ${token}`,
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

async function getTasksInfo(token) {
  try {
    const response = await axios.get('https://api-tg-app.midas.app/api/tasks/available', {
      headers: {
        'Authorization': `Bearer ${token}`,
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
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return { success: true, taskId };
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.error(`Error starting task: ${taskId}. Request failed with status code 400`);
      return { success: false, taskId };
    } else {
      throw new Error('Error starting task: ' + error.message);
    }
  }
}

async function claimTask(token, taskId) {
  try {
    const response = await axios.post(`https://api-tg-app.midas.app/api/tasks/claim/${taskId}`, null, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log(`[>] Task ID: ${taskId}`);
    return { success: true, taskId };
  } catch (error) {
    console.error(`Error claiming task: ${taskId}. Request failed with status code ${error.response ? error.response.status : 'unknown'}`);
    return { success: false, taskId };
  }
}

async function checkAndClaimReferral(token) {
  try {
    const response = await axios.get('https://api-tg-app.midas.app/api/referral/referred-users', {
      headers: {
        'Authorization': `Bearer ${token}`,
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
        const claimResponse = await axios.post('https://api-tg-app.midas.app/api/referral/claim', null, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        console.log('CLAIM REFERRAL SUCCESS');
      } catch (claimError) {
        console.error('Error claiming referral: ' + claimError.message);
      }
    }
  } catch (error) {
    throw new Error('Error fetching referral info: ' + error.message);
  }
}

async function processAccount(token) {
  try {
    const userInfo = await getUserInfo(token);

    const streakInfo = await getStreakInfo(token);

    await checkAndClaimReferral(token);

    const tasksInfo = await getTasksInfo(token);
    
    const userOutput = `\nUSERNAME: ${userInfo.username} | POINTS: ${userInfo.points} | TICKETS: ${userInfo.tickets}\nStreak Start Date: ${streakInfo.streakStartDate}\nStreak Days Count: ${streakInfo.streakDaysCount}`;
    console.log(userOutput);

    const failedTasks = [];
    console.log('\nTasks List:');
    for (const task of tasksInfo) {
      const completionStatus = task.completed ? 'SUDAH DIKERJAKAN' : 'BELUM DIKERJAKAN';
      console.log(`[>] ${task.name} | ${task.mechanic} | ${completionStatus}`);

      if (!task.completed && task.id !== 'connect_wallet') {
        console.log(`START TASK: ${task.id}`);
        const result = await startTask(token, task.id);
        if (!result.success) {
          failedTasks.push(result.taskId);
        }
      }
    }

    if (failedTasks.length > 0) {
      console.log('\nTASKS YANG GAGAL:');
      failedTasks.forEach(taskId => console.log(`[>] Task ID: ${taskId}`));
    }

    console.log('\n[MENUNGGU 15 DETIK UNTUK CLAIM TASKS]');
    await delay(15000);
    console.log('\nMELAKUKAN CLAIM TASKS:');
    for (const task of tasksInfo) {
      if (!task.completed && task.id !== 'connect_wallet') {
        console.log(`[>] Task ID: ${task.id}`);
        await claimTask(token, task.id);
      }
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function main() {
  try {
    const tokens = await readTokensFromFile('ey.txt');
    
    for (const token of tokens) {
      console.log(`========================================`);
      console.log(`Processing account with token:\n${token}`);
      await processAccount(token);
    }
  } catch (error) {
    console.error('Error processing accounts: ' + error.message);
  }
}

main();