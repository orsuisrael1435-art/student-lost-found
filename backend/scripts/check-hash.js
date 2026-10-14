const bcrypt = require('bcryptjs');
const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TdmNkfzk5NEAFYy7M73JqQ0zHwPi';
bcrypt.compare('Password@123', hash).then(r => {
  console.log('Existing hash valid:', r);
  if (!r) {
    bcrypt.hash('Password@123', 12).then(newHash => {
      console.log('New correct hash:', newHash);
    });
  }
});
