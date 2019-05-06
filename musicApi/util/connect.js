const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/myMusic');

const User = new mongoose.Schema({
    userName: String,
    password: String,
    songList: String,
})
// const up = new mongoose.Schema({
//     songList:String
// })
const Song = mongoose.model('Songs', User)
// const SongUp = mongoose.model('Songs', up)
// 注册时将用户数据插入到数据库中
const save = (songInfo) => {
    const song = new Song(songInfo)
    return song.save()
}
// 查找数据
const find = async (songInfo) => {
    let song = ''
    await Song.find(songInfo,function(err,doc){
        if(err){
            console.log('查询出错啦，小弟弟')
            console.log(err)
        }
        else{
            if(!doc || doc.length === 0){
                song = '无查询数据'
                return
            }
            song = doc
            return
        }
    })
    return song
}
// 更新数据
const update = (songInfo) => {
    // console.log(songInfo)
    Song.update({'userName':songInfo.userName},{'songList':songInfo.list},(err,res)=>{
        console.log(res)
    })
}

module.exports = {save,find,update}