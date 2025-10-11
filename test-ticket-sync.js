// Quick test script to verify Discord ticket sync
require('dotenv').config();
const client = require('./config/discordClient');

client.once('ready', async () => {
    console.log('✅ Bot is ready!');
    console.log('Bot:', client.user.tag);
    console.log('Guilds:', client.guilds.cache.size);
    
    const guild = client.guilds.cache.first();
    if (guild) {
        console.log('Guild:', guild.name);
        console.log('Channels:', guild.channels.cache.size);
        
        // Find ticket channels
        const ticketChannels = guild.channels.cache.filter(ch => 
            ch.name.startsWith('ticket-') || ch.name.startsWith('closed-')
        );
        
        console.log('Ticket channels found:', ticketChannels.size);
        ticketChannels.forEach(ch => {
            console.log(`  - ${ch.name} (${ch.id})`);
        });
    }
    
    // Test ticket events
    console.log('\n🎫 Testing ticket events...');
    const initTicketEvents = require('./bot/ticketEvents');
    initTicketEvents(client);
    
    console.log('\n✅ Test complete! Bot is listening for messages.');
    console.log('Try sending a message in a Discord ticket channel...');
});
