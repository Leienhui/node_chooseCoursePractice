function Mytable (obj) {
    this.colName = [
        {
            'c': 'id',
            'e': 'id'
        },

        {
            'c': '名字',
            'e': 'mingzi'
        },
        {
            'c': '简介',
            'e': 'jianjie'
        },
        {
            'c': '老师',
            'e': 'laoshi'
        },
        {
            'c': '星期几',
            'e': 'xingqiji',
            'render': function (dataArr) {
                switch (dataArr.xingqiji) {
                    case '1': return '星期一';
                    case '2': return '星期二';
                    case '3': return '星期三';
                    case '4': return '星期四';
                    case '5': return '星期五';
                }
            }
        },
        {
            'c': '年纪限制',
            'e': 'nianjixianzhi'
        },
        {
            'c': '类型',
            'e': 'leixing'
        },
        {
            'c': '剩余人数',
            'e': 'renshuxianzhi'
        },
        {
            'c': '已报人数',
            'e': 'yibaorenshu'
        },
        {
            'c': '选课',
            'render': function (dataArr) {
                if (dataArr.renshuxianzhi > dataArr.yibaorenshu) {
                    return `<input type="button" class="btn btn-success" data-id=${dataArr.id} data-baoming="baoming"  value="能报" />`
                }
                else {
                    return '<input type="button" disabled="disabled" class="btn btn-danger"  value="不能报"/>'
                }
            }
        },

    ];
    this.el = obj.el;
    this.dataArr = [];
}
Mytable.prototype.render = function (dataArr) {

    if (this.dataArr.length == 0) {
        this.dataArr = dataArr;
    }
    this.table = document.createElement('table');
    this.table.className = 'table';
    this.tr = document.createElement('tr')
    this.table.appendChild(this.tr);
    for (let i = 0; i < this.colName.length; i++) {
        let th = document.createElement('th');
        if (this.colName[i].hasOwnProperty('c')) {
            th.innerText = this.colName[i].c;
        }
        this.tr.appendChild(th);
    }
    for (let i = 0; i < dataArr.length; i++) {
        let tr = document.createElement('tr');
        for (let j = 0; j < this.colName.length; j++) {
            let td = document.createElement('td');
            if (this.colName[j].hasOwnProperty('render')) {
                td.innerHTML = this.colName[j]['render'](dataArr[i]);
            } else {
                td.innerText = dataArr[i][this.colName[j].e];
            }
            tr.appendChild(td);
        }
        this.table.appendChild(tr);
    }
    this.el.appendChild(this.table);
}
Mytable.prototype.chooseCourse = function (obj) {
    console.log(obj)
    this.el.removeChild(this.table);
    let result = this.dataArr.filter(function (dataArr) {
        if (obj.xingqiji.length != 0 && !obj.xingqiji.includes(dataArr.xingqiji)) {
            return false;
        }
        if (obj.leixing.length != 0 && !obj.leixing.includes(dataArr.leixing)) {
            return false;
        }
        if (obj.nianjixianzhi && !dataArr.nianjixianzhi.includes(obj.nianjixianzhi)) {
            return false;
        }
        return true;
    })
    this.render(result);

}

