const mongoClient=require('mongodb').MongoClient;
state={db:null}

module.exports={
    connect:(callback)=>{
        const dbName='shopping';
        const dbUrl='mongodb+srv://ytshidan50:dcbot50@ecommerce.wbb2te3.mongodb.net/';
        
        try{
            const client=new mongoClient(dbUrl);
            state.db=client.db(dbName);
            callback();
        }catch(err){
            return callback(err);
        }
    },
    get:()=>{
        return state.db;
    },
}