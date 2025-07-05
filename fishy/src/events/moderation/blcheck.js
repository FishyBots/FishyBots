const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "guildMemberAdd",
    run: async (client, member) => {
        try {
            const guildId = member.guild.id;
            const blacklist = await db.prepare("SELECT * FROM bl WHERE fishyId = ? AND guild = ?").get(client.fishyId, guildId);

            if (blacklist) {
                const userIds = JSON.parse(blacklist.userIds || "[]");
                if (userIds.includes(member.id)) {
                    await member.ban({ reason: 'Utilisateur dans la blacklist' });
                    console.log(`L'utilisateur ${member.user.tag} a été automatiquement rebanni car il est dans la liste noire.`);
                }
            } else {
                console.log(`Base de données non trouvée ! pour la guild ${guildId}`);
            }
        } catch (error) { 
            console.error('Erreur lors de la vérification de la liste noire:', error);
        }
    }
};
